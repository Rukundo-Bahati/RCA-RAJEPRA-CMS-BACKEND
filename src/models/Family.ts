export interface FamilyMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: 'M' | 'F';
    class: 'Y1' | 'Y2' | 'Y3' | 'Parent';
    role?: 'Pere' | 'Mere';
}

export interface Family {
    id: string;
    name: string;
    generation: string;
    pere?: FamilyMember;
    mere?: FamilyMember;
    members: FamilyMember[];
}
